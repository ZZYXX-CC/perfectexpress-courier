import { getTicket, getTicketReplies } from '@/app/actions/tickets'
import { notFound } from 'next/navigation'
import TicketClient from './TicketClient'

export default async function TicketPage({
    params,
}: {
    params: Promise<{ ticket_id: string }>
}) {
    const { ticket_id } = await params
    const ticket = await getTicket(ticket_id)
    
    if (!ticket) {
        notFound()
    }

    const replies = await getTicketReplies(ticket_id)

    return <TicketClient ticket={ticket} initialReplies={replies} />
}
